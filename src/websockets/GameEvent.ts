enum GameEvent {
    START = 'game_start',
    END = 'game_end',
    ALIVE_REQUEST = 'game_alive_request',
    ALIVE_RESPONSE = 'game_alive_response',
    REWARD_ELIGIBLE = 'game_reward_eligible',
    REWARD_WON = 'game_reward_won',
    REWARD_LOST = 'game_reward_lost'
}

export default GameEvent;