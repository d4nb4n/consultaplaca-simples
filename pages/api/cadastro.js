export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  // 📥 Dados recebidos do formulário
  let { nome, telefone, email, cep, placa, blindado, importado, utilizacao } = req.body;

  console.log("Dados recebidos:", { nome, telefone, email, cep, placa, blindado, importado, utilizacao });

  try {
    const consulta = await fetch(
      `https://consultaplaca-simples.vercel.app/api/placa?id=${placa}`
    );

    console.log("Consulta status:", consulta.status);

    if (!consulta.ok) {
      return res.status(502).json({ erro: "Falha ao consultar placa" });
    }

    const dadosPlaca = await consulta.json();

    // 🔎 Logar apenas um preview resumido da resposta
    const preview = JSON.stringify(dadosPlaca).slice(0, 200);
    console.log("Preview dos dados da placa:", preview);

    const leadCompleto = {
      nome,
      telefone,
      email,
      cep,
      placa,
      blindado,
      importado,
      utilizacao,
      veiculo: dadosPlaca
    };

    console.log("Lead completo:", leadCompleto);

    return res.status(200).json({ sucesso: true, lead: leadCompleto });
  } catch (err) {
    console.error("Erro no cadastro:", err.message);
    return res.status(500).json({ erro: "Falha no cadastro", detalhe: err.message });
  }
}
