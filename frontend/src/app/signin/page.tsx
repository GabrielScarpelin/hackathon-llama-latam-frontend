import { signIn } from "@/auth";
import GoogleIcon from "@/components/icons/GoogleIcon";

export default function SigninPage() {
    return (
        <div className="bg-[#4A3C8D] w-full h-full flex items-center justify-center">
            <div>
                <h1 className="text-4xl text-white font-bold text-center">Sign in</h1>
                <form className="flex flex-col gap-4 mt-4" action={async () => {
                    "use server";
                    await signIn("google");
                }}>
                    <button className="bg-gray-200 drop-shadow-lg text-black py-2 px-4 rounded-xl flex gap-4 items-center font-semibold text-lg" type="submit"><GoogleIcon className="w-8 h-8"/>Login com o Google</button>
                </form>
            </div>
        </div>
    );
}