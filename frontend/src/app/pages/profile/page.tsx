import { signOut } from "@/auth";

export default function Page() {
    return (
        <div className="w-full h-full justify-center items-center">
            { /* Signout */ }
            <div className="w-full h-full flex items-center justify-center">
                <div>
                    <h1 className="text-4xl text-white font-bold text-center">Sign out</h1>
                    <form className="flex flex-col gap-4 mt-4" action={async () => {
                        "use server";
                        await signOut({
                            redirectTo: "/signin",
                        });
                    }}>
                        <button className="bg-red-600 drop-shadow-lg text-white py-2 px-4 rounded-xl flex gap-4 items-center font-semibold text-lg" type="submit">Sair da plataforma</button>
                    </form>
                </div>
            </div>
        </div>
    )
}