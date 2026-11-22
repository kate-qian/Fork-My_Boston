
export default function SignupPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F7F5EF] text-[#292D27]">
            <div className="rounded-2xl border border-[#E8E3D8] bg-white p-10 text-center shadow-sm">
                <h1 className="font-serif text-4xl">
                    Welcome to Fork My Boston!
                </h1>

                <p className="mt-4 text-[#77796F]">
                    Create an Account
                </p>

                <a
                    href="/login"
                    className="mt-6 inline-block text-sm font-semibold text-[#C97955] hover:text-[#A85D3F]"
                >
                    Already have an account? Log In
                </a>

                <p className="mt-4 text-center text-sm">
                    <a href="/" className="text-[#929187] hover:text-[#C97955]">
                        Back
                    </a>
                </p>
            </div>
        </main>
    );
}
