import { PageHeader } from "@/components/ui/page-header";
import { getSessionContext } from "@/lib/session";

import { ProfileForm } from "./profile-form";

export const metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const { profile, pillars } = await getSessionContext();

  return (
    <>
      <PageHeader
        title="Meu perfil"
        subtitle={profile.role === "admin" ? "Você é administrador" : undefined}
      />
      <ProfileForm profile={profile} pillars={pillars} />
    </>
  );
}
