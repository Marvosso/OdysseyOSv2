export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Incoming body:", body)

    return new Response(
      JSON.stringify({ status: "route alive" }),
      { status: 200 }
    )

  } catch (err) {
    console.error("Route crashed:", err)
    return new Response("Server error", { status: 500 })
  }
}
