export default function LandingDecorBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.5%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-cyan-400/30 to-transparent rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/25 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-gradient-to-br from-amber-400/15 to-transparent rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-gradient-to-br from-cyan-400/15 to-transparent rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "4s" }} />

      <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-cyan-500/40 animate-bounce" style={{ animationDuration: "3s" }} />
      <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-blue-500/40 animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
      <div className="absolute top-60 left-1/4 w-2 h-2 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "1s" }} />
      <div className="absolute top-80 right-1/3 w-2 h-2 rounded-full bg-amber-500/40 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "1.5s" }} />
      <div className="absolute top-32 left-1/2 w-3 h-3 rounded-full bg-cyan-500/40 animate-bounce" style={{ animationDuration: "3s", animationDelay: "2s" }} />
      <div className="absolute bottom-40 left-20 w-2 h-2 rounded-full bg-cyan-500/40 animate-bounce" style={{ animationDuration: "5s", animationDelay: "0.8s" }} />
      <div className="absolute bottom-60 right-40 w-3 h-3 rounded-full bg-blue-500/40 animate-bounce" style={{ animationDuration: "4s", animationDelay: "2.5s" }} />
      <div className="absolute bottom-32 left-1/3 w-2 h-2 rounded-full bg-purple-500/40 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "3s" }} />

      <div className="absolute top-1/4 left-[10%] w-16 h-16 border-2 border-cyan-500/20 rotate-45 animate-spin" style={{ animationDuration: "20s" }} />
      <div className="absolute bottom-1/3 right-[15%] w-12 h-12 border-2 border-blue-500/20 rotate-12 animate-spin" style={{ animationDuration: "25s", animationDirection: "reverse" }} />
      <div className="absolute top-2/3 left-[20%] w-8 h-8 border border-purple-500/20 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
    </div>
  );
}
