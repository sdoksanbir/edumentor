import { Outlet } from "react-router-dom"

export function AuthLayout() {
  return (
    // ✅ Her durumda dark görünüm (theme ne olursa olsun)
    <div className="dark min-h-screen">
      {/* ✅ Dark renkleri SABİTLE (light/system etkilenmez) */}
      <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
        {/* Global dark arka plan */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/30" />
          <div className="absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        </div>

        {/* Sayfa dikey + yatay ortalı */}
        <div className="mx-auto grid min-h-screen max-w-6xl place-items-center px-6">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* ================= SOL: LOGO + SLOGAN + GÖRSEL ================= */}
            <div className="hidden lg:flex flex-col items-center justify-center">
              {/* ✅ Daha büyük logo */}
              <img
                src="/images/auth/edumath-logo.webp"
                alt="EDUMATH"
                className="mb-6 h-16 w-auto object-contain opacity-95"
              />

             

              {/* Hero Görsel */}
              <img
                src="/images/auth/edumath-hero.webp"
                alt="EDUMATH online koçluk"
                className="max-h-[480px] w-auto object-contain opacity-95 mb-6"
              />
               {/* ✅ Daha ilgi çekici slogan + biraz daha büyük font */}
              <p className="mb-7 text-center text-base font-semibold tracking-tight text-slate-200">
                Hedefine akıllı planla, hızlı ilerle.
              </p>
            </div>

            {/* ================= SAĞ: LOGIN KART ================= */}
            <div className="w-full">
              <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)] backdrop-blur">
                <div className="border-b border-white/10 bg-white/5 px-6 py-6">
                  {/* ✅ Logo ortalı + biraz daha büyük */}
                  <div className="flex justify-center">
                    <img
                      src="/images/auth/edumath-logo.webp"
                      alt="EDUMATH"
                      className="h-14 w-auto object-contain opacity-95"
                    />
                  </div>
                </div>

                {/* Form içeriği */}
                <div className="p-6">
                  <Outlet />
                </div>

                <div className="px-6 pb-5">
                  <p className="text-center text-xs text-slate-400">
                    © {new Date().getFullYear()} EDUMATH
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  )
}
