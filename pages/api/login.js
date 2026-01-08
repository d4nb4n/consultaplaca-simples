import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const emailEnviado = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const senhaEnviada = req.body.password ? String(req.body.password).trim() : '';

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log("--- TESTE DE CONEXÃO ---");
    console.log("Tentando e-mail:", emailEnviado);

    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailEnviado)
      .maybeSingle();

    if (error) {
      console.log("Erro do Supabase:", error.message);
      return res.status(500).json({ erro: "Erro no banco: " + error.message });
    }

    if (!user) {
      console.log("Utilizador não encontrado no banco de dados.");
      return res.status(401).json({ erro: "E-mail não encontrado no banco." });
    }

    console.log("Utilizador encontrado! Validando senha...");
    console.log("Senha no Banco:", user.password);
    console.log("Senha Enviada:", senhaEnviada);

    if (String(user.password).trim() !== senhaEnviada) {
      return res.status(401).json({ erro: "Senha incorreta no confronto final." });
    }

    return res.status(200).json({ 
      sucesso: true, 
      user: { nome: user.nome, role: user.role, email: user.email } 
    });

  } catch (err) {
    console.log("Erro Crítico:", err.message);
    return res.status(500).json({ erro: err.message });
  }
}