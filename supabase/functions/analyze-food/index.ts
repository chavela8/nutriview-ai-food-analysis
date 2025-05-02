import { Supabase } from '@supabase/ai';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error('Изображение не предоставлено');
    }

    // Инициализируем AI-модель
    const model = new Supabase.ai.Session('gte-small');

    // Анализируем изображение
    const analysis = await model.run(image, {
      tasks: ['food-detection', 'nutrition-analysis'],
      confidence: 0.7,
    });

    // Форматируем результат
    const result = {
      name: analysis.food.name,
      confidence: Math.round(analysis.food.confidence * 100),
      nutrition: {
        calories: analysis.nutrition.calories,
        protein: analysis.nutrition.protein,
        carbs: analysis.nutrition.carbs,
        fat: analysis.nutrition.fat,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});