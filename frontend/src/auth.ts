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

        if (data.exists) {
          return true
        }
        const createUserResponse = await fetch("http://localhost:8000/content/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: profile?.email || user.email,
            name: profile?.name || user.name,
            image_url: profile?.image || user.image,
          })
        });

        if (!createUserResponse.ok) {
          throw new Error("Failed to create user")
        }

        return "/signin/first-questions"
      } catch (error) {
        console.error("Failed to sign in", error)
        return false
      }
    }
  }
})