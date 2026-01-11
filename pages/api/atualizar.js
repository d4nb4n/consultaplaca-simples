import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { id, field, value, multipleData } = req.body;

  if (!id) return res.status(400).json({ erro: "ID é obrigatório" });

  // Mapeamento completo PRESERVADO do seu arquivo original
  const columnMap = {
    'vehicle': 'veiculo',
    'tipo_veiculo': 'tipo_veiculo',
    'ano_fabricacao': 'ano_fabricacao',
    'ano_modelo': 'ano_modelo',
    'cor': 'cor', // Nova coluna adicionada
    'taxa_adesao': 'taxa_adesao_valor',
    'desconto': 'desconto_cliente',
    'indicacao': 'indicacao_valor',
    'indicacao_paga': 'indicacao_paga',
    'indicacao_nome': 'indicacao_nome',
    'indicacao_pix': 'indicacao_pix',
    'status': 'status'
  };

  try {
    let updatePayload = {};

    // Lógica para suportar a consulta automática (múltiplos campos de uma vez)
    if (multipleData) {
      Object.keys(multipleData).forEach(key => {
        const targetCol = columnMap[key] || key;
        updatePayload[targetCol] = multipleData[key];
      });
    } else {
      // Lógica original para edição campo a campo
      const targetColumn = columnMap[field] || field;
      updatePayload[targetColumn] = value;
    }

    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
    return res.status(200).json({ sucesso: true });
  } catch (err) {
    console.error("Erro na atualização:", err.message);
    return res.status(500).json({ erro: err.message });
  }
}