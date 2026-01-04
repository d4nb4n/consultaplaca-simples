export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    console.log("Placa não informada");
    return res.status(400).json({ erro: "Placa obrigatória" });
  }

  const placa = String(id).trim().toUpperCase();
  console.log("Consulta recebida para placa:", placa);

  const sites = [
    `https://puxaplaca.com.br/placa/${placa}`,
    `https://www.keplaca.com/placa?placa-fipe=${placa}`
  ];

  const services = [
    {
      name: "ZenRows",
      key: process.env.ZENROWS_KEY,
      url: (target) => `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_KEY}&url=${encodeURIComponent(target)}`
    },
    {
      name: "ScrapDo",
      key: process.env.SCRAPDO_KEY,
      url: (target) => `https://api.scrape.do?token=${process.env.SCRAPDO_KEY}&url=${encodeURIComponent(target)}`
    }
  ];

  try {
    let lastError = null;

    for (const site of sites) {
      for (const service of services) {
        if (!service.key) {
          console.warn(`Chave ausente para ${service.name}`);
          continue;
        }
        try {
          console.log(`Tentando consulta: site=${site}, serviço=${service.name}`);
          const response = await fetch(service.url(site));
          console.log(`Status da resposta (${service.name}):`, response.status);

          if (!response.ok) throw new Error(`${service.name} falhou`);
          const html = await response.text();

          // 🔎 Logar apenas um preview do HTML
          const preview = html.slice(0, 200).replace(/\n/g, " ");
          console.log(`Preview do HTML (${service.name}):`, preview);

          if (!html.includes("Attention Required")) {
            return res.status(200).json({ placa, site, service: service.name, htmlPreview: preview });
          }
        } catch (err) {
          lastError = err;
          console.error(`Erro com ${service.name} em ${site}:`, err.message);
        }
      }
    }

    return res.status(500).json({ erro: "Nenhum serviço conseguiu consultar", detalhe: lastError?.message });
  } catch (err) {
    console.error("Falha geral:", err.message);
    return res.status(500).json({ erro: "Falha geral", detalhe: err.message });
  }
}
