require('dotenv').config();

const nickname = 'gordopeke'; // tu nick de FACEIT, para probar con un caso conocido

async function testFaceit() {
  const response = await fetch(
    `https://open.faceit.com/data/v4/players?nickname=${nickname}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FACEIT_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log('Nivel:', data.games.cs2.skill_level);
  console.log('ELO:', data.games.cs2.faceit_elo);
}

testFaceit();