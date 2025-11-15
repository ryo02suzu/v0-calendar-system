import { z } from "zod"

const basePatientSchema = z.object({
  name: z.string().min(1, "患者名は必須です"),
  phone: z.string().min(1, "電話番号は必須です"),
  email: z.string().email().optional(),
  kana: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  medical_notes: z.string().optional(),
})

export const patientCreateSchema = basePatientSchema

export const patientUpdateSchema = basePatientSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "少なくとも1項目を指定してください",
  },
)
