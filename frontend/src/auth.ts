import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import jwt from "jsonwebtoken"
declare module "next-auth" {
  interface Session extends DefaultSession {
    jwt?: string; // Adiciona o campo `jwt` ao objeto `Session`
    user: {
      id: string; // Certifique-se de incluir outros campos personalizados
    } & DefaultSession["user"];
  }

  interface JWT {
    id?: string; // Adiciona o ID do usuário ao token JWT
  }
}
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt", // 1 DIA DE DURAÇÃO
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const response = await fetch("http://localhost:8000/content/check/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: profile?.email || user.email,
          })
        })
        if (!response.ok) {
          throw new Error("Failed to sign in")
        }
        const data = await response.json()


        // taking the id from the user
        if (data.exists) {
          user.id = data.id;

          return true
        }

        // if the user doesn't exist, we redirect to the first questions
        return "/signin/first-questions?email=" + (profile?.email || user.email) + "&name=" + (profile?.name || user.name) + "&image=" + (profile?.image || user.image)

      } catch (error) {
        console.error("Failed to sign in", error)
        return false
      }
    },
    async jwt({ token, user }) {
      // Inclui o ID e outras informações no token JWT
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Inclui o ID e outras informações na sessão
      if (token) {
        console.log(token)
        session.user.id = token.id as string;
        session.jwt = jwt.sign({
          id: session.user.id,
          name: session.user.name,

        }, process.env.SECRET_KEY as string, {
          algorithm: "HS256",
          expiresIn: "1d"
        }); // Adiciona o token completo na sessão
      }
      return session;
    },
  }
})