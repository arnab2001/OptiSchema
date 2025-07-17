import asyncio
import asyncpg

async def test_connection():
    try:
        conn = await asyncpg.connect('postgresql://optischema:optischema_pass@postgres:5432/optischema')
        print('Connection successful!')
        await conn.close()
    except Exception as e:
        print('Connection failed:', e)

if __name__ == "__main__":
    asyncio.run(test_connection()) 