require('dotenv').config();

async function testFaceitPorSteam() {
  const steamId64 = '76561198129034232'; // tu SteamID64 real, de la URL de tu perfil

  const faceitResponse = await fetch(
    `https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${steamId64}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      },
    }
  );

  if (!faceitResponse.ok) {
    console.log('No se encontro cuenta de FACEIT vinculada a este Steam');
    console.log('Status:', faceitResponse.status);
    return;
  }

  const faceitData = await faceitResponse.json();
  console.log('Nickname FACEIT encontrado:', faceitData.nickname);
  console.log('Nivel:', faceitData.games.cs2.skill_level);
  console.log('ELO:', faceitData.games.cs2.faceit_elo);
}

testFaceitPorSteam();