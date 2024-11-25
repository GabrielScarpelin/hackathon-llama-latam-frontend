import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page({
    searchParams,
} : {
    searchParams?: { [key: string]: string | string[] | undefined };
}) {

    const session = await auth();

    console.log(session);

    return (
        <div className="w-full h-full bg-[#4A3C8D] flex items-center justify-center">
            <div className="w-full max-w-[400px] bg-white p-6 rounded-xl shadow-lg max-h-[95%] overflow-y-scroll">
                {/* Título da página */}
                <h1 className="text-2xl font-bold text-[#4A3C8D] mb-2">Bem vindo, {searchParams?.name}!</h1>
                <p>Email de cadastro: {searchParams?.email}</p>
                <h1 className="text-2xl font-bold text-[#4A3C8D] mb-2 mt-2">Perguntas Iniciais</h1>
                <p className="text-gray-600 mb-4">
                    Essas perguntas ajudarão a nossa plataforma a criar um plano divertido e eficiente para ensinar Libras ao seu filho!
                </p>

                {/* Formulário */}
                <form action={async (data: FormData) => {
                    "use server";
                    console.log("Formulário submetido");
                    console.log(data);

                    const age = data.get("age");
                    const level = data.get("level");
                    const interesting = data.get("interesting");
                    const learning = data.get("learning");

                    const response = await fetch(process.env.SERVER_URL+"/content/users/register", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            name: searchParams?.name,
                            email: searchParams?.email,
                            image_url: searchParams?.image,
                            age: parseInt(age as string),
                            experience_level: level,
                            interesting: interesting,
                            learning_time: parseInt(learning as string)
                        })
                    });

                    const responseData = await response.json();
                    console.log(responseData);
                    const responseRoadmap = await fetch(process.env.SERVER_URL+"/roadmaps/api/parent-roadmap", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            user_id: responseData.id,
                            interest: interesting,
                        })
                    });

                    if (!response.ok || !responseRoadmap.ok) {
                        console.error("Erro ao enviar dados:", responseData.detail);
                        redirect("/signin?error=register");
                    }

                    console.log("Dados enviados com sucesso:", responseData);
                    redirect("/signin?success=register");

                }} className="flex flex-col gap-6 mt-4">
                    {/* Idade */}
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                            Qual é a idade da criança?
                        </label>
                        <input
                            type="number"
                            name="age"
                            id="age"
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A3C8D]"
                            placeholder="Digite a idade da criança"
                        />
                    </div>

                    {/* Nível de conhecimento */}
                    <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                            A criança já sabe algo sobre Libras?
                        </label>
                        <select
                            name="level"
                            id="level"
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3C8D]"
                        >
                            <option value="beginner">Não, é iniciante</option>
                            <option value="intermediated">Sim, conhece o básico</option>
                            <option value="advanced">Sim, já conhece bastante</option>
                        </select>
                    </div>

                    {/* Interesse em temas */}
                    <div>
                        <label htmlFor="interesting" className="block text-sm font-medium text-gray-700">
                            Quais temas a criança mais gosta? (separe por vírgulas)
                        </label>
                        <input
                            type="text"
                            name="interesting"
                            id="interesting"
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4A3C8D]"
                            placeholder="Exemplo: animais, esportes, desenhos animados"
                        />
                    </div>

                    {/* Tempo disponível */}
                    <div>
                        <label htmlFor="learning" className="block text-sm font-medium text-gray-700">
                            Quanto tempo por dia a criança pode dedicar ao aprendizado?
                        </label>
                        <select
                            name="learning"
                            id="learning"
                            required
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#4A3C8D]"
                        >
                            <option value="10">10 minutos</option>
                            <option value="20">20 minutos</option>
                            <option value="30">30 minutos</option>
                            <option value="40">40 minutos</option>
                            <option value="50">50 minutos</option>
                            <option value="+60">Mais de uma hora</option>
                        </select>
                    </div>

                    {/* Botão de submissão */}
                    <button
                        type="submit"
                        className="bg-[#4A3C8D] text-white py-2 rounded-md font-semibold hover:bg-[#3B3071] transition-colors"
                    >
                        Próximo
                    </button>
                </form>
            </div>
        </div>
    );
}
