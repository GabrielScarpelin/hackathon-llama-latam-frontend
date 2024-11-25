import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
  // automatically try to redirect to the login page if the user is not authenticated
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }
  redirect("/pages/home");
}
