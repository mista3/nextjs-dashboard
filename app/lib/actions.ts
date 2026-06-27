'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { z } from "zod";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  date: z.string(),
  status: z.enum(['pending', 'paid']),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const EditInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const parsed = CreateInvoice.parse({ 
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = parsed.amount * 100;
  const date = new Date().toISOString().split('T')[0];
  
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${parsed.customerId}, ${amountInCents}, ${parsed.status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function editInvoice(id: string, formData: FormData) {
  const parsed = EditInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = parsed.amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id=${parsed.customerId}, amount=${amountInCents}, status=${parsed.status}
    WHERE id=${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`
    DELETE FROM invoices
    WHERE id=${id}
  `;

  revalidatePath('/dashboard/invoices');
}