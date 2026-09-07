import { listUsers } from '@/lib/users';
import { loginAction } from '@/lib/actions';

export default function LoginPage() {
  const users = listUsers();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-2xl font-semibold">DocShare</h1>
      <p className="mb-8 text-sm text-gray-600">
        This demo skips real authentication — pick one of the seeded users below to continue.
      </p>
      <div className="flex flex-col gap-3">
        {users.map((user) => (
          <form action={loginAction} key={user.id}>
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 hover:shadow"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.name[0]}
              </span>
              <span>
                <span className="block font-medium">{user.name}</span>
                <span className="block text-xs text-gray-500">{user.email}</span>
              </span>
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
