import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uploadSchema = z.object({
  applicationId: z.string().uuid(),
  code: z.string().min(4).max(64),
  kind: z.string().min(2).max(60),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(3).max(120),
  dataBase64: z.string().min(10).max(9_000_000),
});

/** Public: an applicant uploads an identification document using their private code. */
export const uploadApplicantDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => uploadSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select("id, property_id, access_code")
      .eq("id", data.applicationId)
      .maybeSingle();

    if (appError) throw new Error("Could not verify this document link");
    if (!application || application.access_code !== data.code) {
      throw new Error("Invalid document link");
    }

    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.byteLength > 6_000_000) throw new Error("File is larger than 6MB");

    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${application.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("tenant-documents")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (uploadError) throw new Error("Upload failed. Please try again.");

    const { error: insertError } = await supabaseAdmin.from("documents").insert({
      application_id: application.id,
      property_id: application.property_id,
      kind: data.kind,
      file_path: path,
      original_name: data.fileName,
    });
    if (insertError) {
      await supabaseAdmin.storage.from("tenant-documents").remove([path]);
      throw new Error("Could not save the document record");
    }

    return { ok: true as const };
  });

/** Signed-in owners/admins open a stored document. RLS decides who may see it. */
export const getDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ documentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("id, file_path")
      .eq("id", data.documentId)
      .maybeSingle();
    if (error || !doc) throw new Error("Document not found");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("tenant-documents")
      .createSignedUrl(doc.file_path, 60 * 10);
    if (signError || !signed) throw new Error("Could not open this document");

    return { url: signed.signedUrl };
  });
