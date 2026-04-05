import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";

export default async function LoginPage() {
  try {
    const session = await auth();
    if (session) redirect("/dashboard");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    // Auth errors (e.g., no DB connection) are OK on login — just show the form
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Sign in to Git<span className="text-blue-600">Scout</span>
      </h1>
      <p className="mt-4 max-w-md text-foreground/60">
        Connect your GitHub account so we can analyze your coding style and find
        the perfect open-source projects for you.
      </p>
      <div className="mt-8">
        <SignInButton />
      </div>
    </main>
  );
}
