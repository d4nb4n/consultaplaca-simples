import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const emailEnviado = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const senhaEnviada = req.body.password ? String(req.body.password).trim() : '';

  try {
    // Busca usando ilike (ignora maiúsculas/minúsculas no banco)
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('email', emailEnviado)
      .maybeSingle();

    console.log("--- DIAGNÓSTICO FINAL ---");
    console.log("Buscando por:", emailEnviado);

    if (error) {
      console.log("Erro na query:", error.message);
      return res.status(500).json({ erro: error.message });
    }

    if (!user) {
      console.log("Resultado: E-mail não existe na tabela 'usuarios'");
      return res.status(401).json({ erro: "E-mail não encontrado." });
    }

    // Comparação limpando espaços de ambos os lados
    const senhaBanco = String(user.password).trim();
    
    console.log("Senha no banco:", senhaBanco);
    console.log("Senha digitada:", senhaEnviada);

    if (senhaBanco !== senhaEnviada) {
      console.log("Resultado: Senha não confere.");
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    console.log("Resultado: LOGIN AUTORIZADO!");
    return res.status(200).json({ 
      sucesso: true, 
      user: { nome: user.nome || user.name, role: user.role } 
    });

  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
}