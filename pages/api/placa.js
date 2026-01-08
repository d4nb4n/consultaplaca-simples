import cheerio from "cheerio";

export default async function handler(req, res) {
  // 1. Mantém as configurações de CORS originais
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ erro: "Placa obrigatória" });
  }

  const placa = String(id).trim().toUpperCase();

  // 2. Mantém os sites de consulta
  const sites = [
    `https://puxaplaca.com.br/placa/${placa}`,
    `https://www.keplaca.com/placa?placa-fipe=${placa}`
  ];

  // 3. Mantém a lógica de serviços, mas adiciona o js_render para o ZenRows
  const services = [
    {
      name: "ZenRows",
      key: process.env.ZENROWS_KEY,
      // Adicionado &js_render=true conforme recomendação do painel ZenRows
      url: (target) => `https://api.zenrows.com/v1/?apikey=${process.env.ZENROWS_KEY}&url=${encodeURIComponent(target)}&js_render=true`
    },
    {
      name: "ScrapDo",
      key: process.env.SCRAPDO_KEY,
      url: (target) => `https://api.scrape.do?token=${process.env.SCRAPDO_KEY}&url=${encodeURIComponent(target)}`
    }
  ];

  try {
    let lastErrorMessage = "Nenhum serviço respondeu corretamente";

    for (const site of sites) {
      for (const service of services) {
        if (!service.key) continue;

        try {
          const response = await fetch(service.url(site));
          if (!response.ok) {
            lastErrorMessage = `${service.name} retornou status ${response.status}`;
            continue;
          }
          
          const html = await response.text();

          // Verifica se o HTML é válido e não é uma página de bloqueio
          if (html && !html.includes("Attention Required") && html.length > 500) {
            const $ = cheerio.load(html);
            const text = $("body").text().replace(/\s+/g, " ").trim();
            
            // Lógica de extração idêntica à sua original
            let tipo = /Moto|Motocicleta/i.test(text) ? "Moto" : "Carro";
            let marca = text.match(/Marca:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
            let modelo = text.match(/Modelo:\s*([A-Za-zÀ-ú0-9\- ]+)/i)?.[1] || "";
            let ano = text.match(/\b(19|20)\d{2}\b/)?.[0] || "n/a";
            let cor = ["Prata","Preto","Branco","Vermelho","Azul","Cinza"].find(c => new RegExp(`\\b${c}\\b`, "i").test(text)) || "n/a";

            // Só retorna sucesso se encontrar dados mínimos
            if (marca || modelo) {
              return res.status(200).json({ 
                placa, 
                tipo, 
                marca, 
                modelo, 
                ano, 
                cor,
                service: service.name 
              });
            }
          }
        } catch (err) {
          lastErrorMessage = err.message;
        }
      }
    }

    // Retorno de erro corrigido para evitar o "undefined"
    return res.status(500).json({ 
      erro: "Nenhum serviço disponível", 
      detalhe: lastErrorMessage 
    });

  } catch (err) {
    return res.status(500).json({ erro: "Falha geral", detalhe: err.message });
  }
}