import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
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
        session.user.id = token.id as string;
      }
      return session;
    },
  }
})