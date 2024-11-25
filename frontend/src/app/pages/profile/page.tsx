import { auth } from "@/auth";
import Image from "next/image";

export default async function Page() {
    const session = await auth()
    return (
        <div className="flex flex-col items-center justify-center pt-8 space-y-4">
            <div className="w-1/2 h-auto p-4 rounded-lg shadow-md bg-p">
            <div className="flex items-center space-x-4 mb-6">
                {/* Ícone ou Avatar */}
                <Image src={session?.user?.image ? session?.user?.image : ""} className="w-12 h-12 rounded-full bg-pink-500" alt="Foto do seu usuário"/>
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


        </div>
    );
}