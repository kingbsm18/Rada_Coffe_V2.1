export type SignInInput = { email: string; password: string }
export type AuthSession = { authenticated: true; user: { id: string; name: string; email: string } }

export async function signIn(input: SignInInput): Promise<AuthSession> {
  const { apiRequest } = await import('./http')
  return apiRequest<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(input) })
}
