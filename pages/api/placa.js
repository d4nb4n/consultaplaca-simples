export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: "Placa obrigatória" });

  const placa = String(id).trim().toUpperCase();

  // Sites de consulta
  const sites = [
    `https://puxaplaca.com.br/placa/${placa}`,
    `https://www.keplaca.com/placa?placa-fipe=${placa}`
  ];

  // Serviços de scraping
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

    // Tenta cada site
    for (const site of sites) {
      // Tenta cada serviço
      for (const service of services) {
        try {
          const response = await fetch(service.url(site));
          if (!response.ok) throw new Error(`${service.name} falhou`);
          const html = await response.text();

          // Se não for bloqueio do Cloudflare, retorna
          if (!html.includes("Attention Required")) {
            return res.status(200).json({ placa, site, service: service.name, html });
          }
        } catch (err) {
          lastError = err;
          console.error(`Erro com ${service.name} em ${site}:`, err.message);
        }
      }
    }

    // Se nenhum funcionou
    return res.status(500).json({ erro: "Nenhum serviço conseguiu consultar", detalhe: lastError?.message });
  } catch (err) {
    return res.status(500).json({ erro: "Falha geral", detalhe: err.message });
  }
}
