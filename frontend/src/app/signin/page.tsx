import { signIn } from "@/auth";
import GoogleIcon from "@/components/icons/GoogleIcon";

export default async function SigninPage({
    searchParams,
}: {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const error = searchParams?.error ?? null;
    const success = searchParams?.success ?? null;

    return (
        <div className="bg-[#4A3C8D] w-full h-full flex items-center justify-center flex-col">
            {
                error && (
                    <div className="bg-red-600 text-white p-2 rounded-lg text-sm">
                        Erro ao tentar se registrar. Por favor, tente novamente.
                    </div>
                )
            }
            {
                success && (
                    <div className="bg-green-600 text-white p-2 rounded-lg text-sm">
                        Registro realizado com sucesso! Agora você já pode acessar a plataforma, basta fazer login novamente.
                    </div>
                )
            }
            <div className="mt-14">
                <h1 className="text-4xl text-white font-bold text-center">Sign in</h1>
                <form className="flex flex-col gap-4 mt-4" action={async () => {
                    "use server";
                    await signIn("google", {
                        redirectTo: "/pages/home",
                    });
                }}>
                    <button className="bg-gray-200 drop-shadow-lg text-black py-2 px-4 rounded-xl flex gap-4 items-center font-semibold text-lg" type="submit"><GoogleIcon className="w-8 h-8"/>Login com o Google</button>
                </form>
            </div>
        </div>
    );
}