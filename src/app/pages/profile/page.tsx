import { auth, signOut } from "@/auth";
import Image from "next/image";

export default async function Page() {
    const session = await auth()
    return (
        <div className="flex px-8 pt-8 space-y-4 items-center gap-8">
            <div className="w-1/2 h-auto p-4 rounded-lg shadow-md bg-p">
            <div className="flex items-center space-x-4 mb-6">
                {/* Ícone ou Avatar */}
                <Image src={session?.user?.image ? session?.user?.image : ""} className="w-12 h-12 rounded-full bg-pink-500" alt="Foto do seu usuário" width={48} height={48} />
                <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nome:
                </label>
                <div className="text-lg font-semibold text-gray-800 bg-gray-100 p-2 rounded-md">
                    {session?.user?.name || "Nome não disponível"}
                </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                Email:
                </label>
                <div className="text-lg font-semibold text-gray-800 bg-gray-100 p-2 rounded-md">
                {session?.user?.email || "Email não disponível"}
                </div>
            </div>

            <div className="mb-4">

            </div>
            </div>
            <form action={async () => {
                "use server";
                await signOut({
                    redirectTo: "/signin",
                });
            }}>
                <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md">
                    Sair da conta
                </button>
            </form>

        </div>
    );
}