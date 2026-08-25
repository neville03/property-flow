import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/rentme/AppShell";
import { Btn, Empty, Panel, TableWrap, Tag, Td, Th } from "@/components/rentme/ui";
import { dateFmt, money } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { getDocumentUrl } from "@/lib/documents.functions";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Tenant Applications — RentMe" },
      {
        name: "description",
        content: "Review tenant applications, move them through stages, open uploaded documents and create leases.",
      },
      { property: "og:title", content: "Tenant Applications — RentMe" },
      { property: "og:description", content: "Review applicants, documents and create leases." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplicationsPage,
});

type Stage = "new" | "contacted" | "approved" | "rejected";

function ApplicationsPage() {
  const qc = useQueryClient();
  const openDoc = useServerFn(getDocumentUrl);
  const [openId, setOpenId] = useState<string | null>(null);

  const apps = useQuery({
    queryKey: ["applications"],
    queryFn: async () =>
      (
        await supabase
          .from("applications")
          .select("*, properties(name), units(number, rent)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const docs = useQuery({
    queryKey: ["documents"],
    queryFn: async () => (await supabase.from("documents").select("*").order("created_at")).data ?? [],
  });

  const setStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("applications").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application updated");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createLease = useMutation({
    mutationFn: async (app: NonNullable<typeof apps.data>[number]) => {
      const { error } = await supabase.from("leases").insert({
        property_id: app.property_id,
        unit_id: app.unit_id!,
        application_id: app.id,
        tenant_name: app.full_name,
        tenant_phone: app.phone,
        rent: Number(app.units?.rent ?? 0),
        start_date: app.move_in_date,
        lease_months: app.lease_months,
      });
      if (error) throw error;
      if (app.unit_id) await supabase.from("units").update({ status: "occupied" }).eq("id", app.unit_id);
    },
    onSuccess: () => {
      toast.success("Lease created and unit marked occupied");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function view(documentId: string) {
    try {
      const res = await openDoc({ data: { documentId } });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open document");
    }
  }

  return (
    <AppShell title="Tenant Applications">
      <Panel title="Applicants">
        {apps.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : apps.data?.length ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Property / Unit</Th>
                <Th>Contact</Th>
                <Th>Move in</Th>
                <Th>Stage</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {apps.data.map((a) => {
                const own = docs.data?.filter((d) => d.application_id === a.id) ?? [];
                return (
                  <>
                    <tr key={a.id}>
                      <Td>
                        <button
                          className="text-left underline decoration-dotted"
                          onClick={() => setOpenId(openId === a.id ? null : a.id)}
                        >
                          {a.full_name}
                        </button>
                        <div className="text-xs text-muted-foreground">{own.length} documents</div>
                      </Td>
                      <Td>
                        {a.properties?.name ?? "—"}
                        <div className="text-xs text-muted-foreground">
                          Unit {a.units?.number ?? "—"} · {money(a.units?.rent)}
                        </div>
                      </Td>
                      <Td>
                        {a.phone}
                        <div className="text-xs text-muted-foreground">{a.email ?? "—"}</div>
                      </Td>
                      <Td>{dateFmt(a.move_in_date)}</Td>
                      <Td>
                        <Tag tone={a.stage === "approved" ? "good" : a.stage === "rejected" ? "bad" : "default"}>
                          {a.stage}
                        </Tag>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          <select
                            className="border border-input bg-background px-2 py-1 text-xs"
                            value={a.stage}
                            onChange={(e) => setStage.mutate({ id: a.id, stage: e.target.value as Stage })}
                          >
                            <option value="new">new</option>
                            <option value="contacted">contacted</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                          </select>
                          <Btn
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard
                                .writeText(`${window.location.origin}/portal/${a.id}/${a.access_code}`)
                                .then(() => toast.success("Document portal link copied"))
                            }
                          >
                            Portal link
                          </Btn>
                          {a.stage === "approved" && a.unit_id ? (
                            <Btn onClick={() => createLease.mutate(a)} disabled={createLease.isPending}>
                              Create lease
                            </Btn>
                          ) : null}
                        </div>
                      </Td>
                    </tr>
                    {openId === a.id ? (
                      <tr key={`${a.id}-detail`}>
                        <Td className="bg-muted" >
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">Details</div>
                          <div className="mt-1 text-xs text-foreground">
                            ID: {a.national_id ?? "—"} · DOB {dateFmt(a.date_of_birth)} · {a.gender ?? "—"} ·{" "}
                            {a.occupants ?? "—"} occupants · {a.lease_months ?? "—"} months
                          </div>
                          {a.notes ? <div className="mt-1 text-xs text-muted-foreground">{a.notes}</div> : null}
                        </Td>
                        <Td className="bg-muted" colSpan={5}>
                          {own.length ? (
                            <div className="flex flex-wrap gap-2">
                              {own.map((d) => (
                                <Btn key={d.id} variant="outline" onClick={() => view(d.id)}>
                                  {d.kind}: {d.original_name ?? "file"}
                                </Btn>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No documents uploaded yet — share the portal link.
                            </span>
                          )}
                        </Td>
                      </tr>
                    ) : null}
                  </>
                );
              })}
            </tbody>
          </TableWrap>
        ) : (
          <Empty title="No applications yet" hint="Generate an application link from a vacant unit." />
        )}
      </Panel>
    </AppShell>
  );
}
