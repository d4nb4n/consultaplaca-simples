import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const emailDigitado = req.body.email?.trim().toLowerCase();
  const senhaDigitada = String(req.body.password || '').trim();

  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailDigitado)
      .maybeSingle();

    console.log("--- TENTATIVA DE LOGIN ---");
    console.log("Email digitado:", emailDigitado);

    if (error) {
      console.log("Erro Supabase:", error.message);
      return res.status(500).json({ erro: error.message });
    }

    if (!user) {
      console.log("Resultado: Usuário não encontrado no banco.");
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    console.log("Senha no banco:", user.password);
    console.log("Senha digitada:", senhaDigitada);

    if (user.password !== senhaDigitada) {
      console.log("Resultado: Senha não confere.");
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    console.log("Resultado: SUCESSO!");
    return res.status(200).json({ sucesso: true, user });

  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}