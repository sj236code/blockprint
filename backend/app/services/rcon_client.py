from typing import Optional, List
from mcrcon import MCRcon
from app.config import get_settings
import time


class RCONClient:
    def __init__(self):
        self.settings = get_settings()
        self._conn: Optional[MCRcon] = None
    
    def connect(self) -> bool:
        """Connect to Minecraft RCON."""
        try:
            self._conn = MCRcon(
                self.settings.rcon_host,
                self.settings.rcon_password,
                port=self.settings.rcon_port
            )
            self._conn.connect()
            return True
        except Exception as e:
            print(f"RCON connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from RCON."""
        if self._conn:
            try:
                self._conn.disconnect()
            except:
                pass
            self._conn = None
    
    def send_command(self, command: str) -> str:
        """Send a single command."""
        if not self._conn:
            raise ConnectionError("Not connected to RCON")
        
        response = self._conn.command(command)
        return response
    
    def send_commands_batch(self, commands: List[str], delay: float = 0.05) -> List[str]:
        """Send multiple commands with delay between each."""
        responses = []
        
        for cmd in commands:
            try:
                response = self.send_command(cmd)
                responses.append(response)
                time.sleep(delay)  # Small delay to prevent server overload
            except Exception as e:
                responses.append(f"Error: {e}")
        
        return responses
    
    def test_connection(self) -> bool:
        """Test if RCON connection is working."""
        try:
            response = self.send_command("help")
            return "Unknown command" in response or "help" in response.lower()
        except:
            return False
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()


# Singleton instance
_rcon_client: Optional[RCONClient] = None


def get_rcon_client() -> RCONClient:
    global _rcon_client
    if _rcon_client is None:
        _rcon_client = RCONClient()
    return _rcon_client
