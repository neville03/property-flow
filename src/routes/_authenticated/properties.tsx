import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";
import { AppShell } from "@/components/rentme/AppShell";
import { Btn, Empty, Field, Panel, TableWrap, Tag, Td, Th, inputClass } from "@/components/rentme/ui";
import { money } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/properties")({
  head: () => ({
    meta: [
      { title: "Properties & Units — RentMe" },
      {
        name: "description",
        content: "Add properties, manage units and generate public tenant application links for vacant units.",
      },
      { property: "og:title", content: "Properties & Units — RentMe" },
      { property: "og:description", content: "Manage properties, units and application links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const qc = useQueryClient();
  const { session } = useSession();
  const { data: account } = useAccount();
  const [selected, setSelected] = useState<string | null>(null);

  const properties = useQuery({
    queryKey: ["properties"],
    queryFn: async () => (await supabase.from("properties").select("*").order("created_at")).data ?? [],
  });

  const propertyId = selected ?? properties.data?.[0]?.id ?? null;

  const units = useQuery({
    queryKey: ["units", propertyId],
    enabled: !!propertyId,
    queryFn: async () =>
      (await supabase.from("units").select("*").eq("property_id", propertyId!).order("number")).data ?? [],
  });

  const links = useQuery({
    queryKey: ["links", propertyId],
    enabled: !!propertyId,
    queryFn: async () =>
      (await supabase.from("application_links").select("*").eq("property_id", propertyId!)).data ?? [],
  });

  const addProperty = useMutation({
    mutationFn: async (form: { name: string; location: string; type: string }) => {
      const { error } = await supabase.from("properties").insert({ ...form, owner_id: session!.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property added");
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addUnit = useMutation({
    mutationFn: async (form: { number: string; bedrooms: number; rent: number }) => {
      const { error } = await supabase.from("units").insert({ ...form, property_id: propertyId! });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Unit added");
      qc.invalidateQueries({ queryKey: ["units", propertyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const makeLink = useMutation({
    mutationFn: async (unitId: string) => {
      const token = crypto.randomUUID().replace(/-/g, "");
      const { error } = await supabase.from("application_links").insert({
        unit_id: unitId,
        property_id: propertyId!,
        token,
        created_by: session!.user.id,
      });
      if (error) throw error;
      return token;
    },
    onSuccess: (token) => {
      copy(`${window.location.origin}/apply/${token}`);
      qc.invalidateQueries({ queryKey: ["links", propertyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copy(url: string) {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Application link copied"),
      () => toast.message(url),
    );
  }

  return (
    <AppShell title="Properties & Units">
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Add property">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget as HTMLFormElement);
              addProperty.mutate({
                name: String(f.get("name")),
                location: String(f.get("location")),
                type: String(f.get("type")),
              });
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <Field label="Name">
              <input name="name" className={inputClass} required />
            </Field>
            <Field label="Location">
              <input name="location" className={inputClass} placeholder="Kampala" />
            </Field>
            <Field label="Type">
              <select name="type" className={inputClass} defaultValue="Apartments">
                <option>Apartments</option>
                <option>Rentals</option>
                <option>Hostel</option>
                <option>Commercial</option>
              </select>
            </Field>
            <Btn className="w-full" disabled={!account?.isApproved || addProperty.isPending}>
              {account?.isApproved ? "Add property" : "Awaiting approval"}
            </Btn>
          </form>
        </Panel>

        <Panel title="Portfolio" className="lg:col-span-2">
          {properties.data?.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {properties.data.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`border p-3 text-left transition ${
                    p.id === propertyId ? "border-foreground bg-muted" : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.location ?? "—"} · {p.type ?? "—"}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="No properties yet" hint="Create your first property to add units." />
          )}
        </Panel>
      </div>

      {propertyId ? (
        <>
          <Panel title="Add unit">
            <form
              className="grid gap-3 sm:grid-cols-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget as HTMLFormElement);
                addUnit.mutate({
                  number: String(f.get("number")),
                  bedrooms: Number(f.get("bedrooms") || 1),
                  rent: Number(f.get("rent") || 0),
                });
                (e.currentTarget as HTMLFormElement).reset();
              }}
            >
              <Field label="Unit number">
                <input name="number" className={inputClass} required />
              </Field>
              <Field label="Bedrooms">
                <input name="bedrooms" type="number" min={0} className={inputClass} defaultValue={1} />
              </Field>
              <Field label={`Rent (${"UGX"})`}>
                <input name="rent" type="number" min={0} className={inputClass} defaultValue={0} />
              </Field>
              <div className="flex items-end">
                <Btn className="w-full" disabled={addUnit.isPending}>
                  Add unit
                </Btn>
              </div>
            </form>
          </Panel>

          <Panel title="Units">
            {units.data?.length ? (
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Unit</Th>
                    <Th>Bedrooms</Th>
                    <Th>Rent</Th>
                    <Th>Status</Th>
                    <Th>Application link</Th>
                  </tr>
                </thead>
                <tbody>
                  {units.data.map((u) => {
                    const link = links.data?.find((l) => l.unit_id === u.id && l.active);
                    return (
                      <tr key={u.id}>
                        <Td>{u.number}</Td>
                        <Td>{u.bedrooms ?? "—"}</Td>
                        <Td className="font-mono">{money(u.rent)}</Td>
                        <Td>
                          <Tag tone={u.status === "occupied" ? "good" : "warn"}>{u.status}</Tag>
                        </Td>
                        <Td>
                          {link ? (
                            <Btn
                              variant="outline"
                              onClick={() => copy(`${window.location.origin}/apply/${link.token}`)}
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy link
                            </Btn>
                          ) : (
                            <Btn variant="outline" onClick={() => makeLink.mutate(u.id)} disabled={makeLink.isPending}>
                              <Link2 className="h-3.5 w-3.5" /> Generate link
                            </Btn>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            ) : (
              <Empty title="No units" hint="Add units to start receiving applications." />
            )}
          </Panel>
        </>
      ) : null}
    </AppShell>
  );
}
