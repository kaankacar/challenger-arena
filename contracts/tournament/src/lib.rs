#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Tournament states
const STATE_REGISTRATION: u8 = 0;
const STATE_ACTIVE: u8 = 1;
const STATE_ENDED: u8 = 2;

/// Strategy types
const STRATEGY_MOMENTUM: u8 = 0;
const STRATEGY_DCA: u8 = 1;
const STRATEGY_MEAN_REVERSION: u8 = 2;

/// Prize distribution (basis points: 10000 = 100%)
const PRIZE_FIRST: u64 = 5000;  // 50%
const PRIZE_SECOND: u64 = 3000; // 30%
const PRIZE_THIRD: u64 = 2000;  // 20%

#[derive(TopEncode, TopDecode, TypeAbi, NestedEncode, NestedDecode, Clone, ManagedVecItem)]
pub struct AgentEntry<M: ManagedTypeApi> {
    pub agent_id: ManagedBuffer<M>,
    pub player_address: ManagedAddress<M>,
    pub strategy_type: u8,
    pub entry_fee: BigUint<M>,
    pub final_roi: i64,          // Basis points (10000 = 100%, -5000 = -50%)
    pub registered_at: u64,
}

#[multiversx_sc::contract]
pub trait Tournament {
    #[init]
    fn init(&self, entry_fee: BigUint) {
        self.entry_fee().set(&entry_fee);
        self.tournament_state().set(STATE_REGISTRATION);
        self.prize_pool().set(BigUint::zero());
    }

    /// Register a new agent for the tournament
    /// Requires payment of entry fee in EGLD
    #[endpoint(registerAgent)]
    #[payable("EGLD")]
    fn register_agent(&self, agent_id: ManagedBuffer, strategy_type: u8) {
        // Validate tournament state
        require!(
            self.tournament_state().get() == STATE_REGISTRATION,
            "Tournament is not accepting registrations"
        );

        // Validate strategy type
        require!(
            strategy_type <= STRATEGY_MEAN_REVERSION,
            "Invalid strategy type"
        );

        // Validate payment
        let payment = self.call_value().egld_value().clone_value();
        let required_fee = self.entry_fee().get();
        require!(
            payment >= required_fee,
            "Insufficient entry fee"
        );

        // Check if agent already registered
        require!(
            self.agents(&agent_id).is_empty(),
            "Agent ID already registered"
        );

        let caller = self.blockchain().get_caller();
        let timestamp = self.blockchain().get_block_timestamp();

        let agent = AgentEntry {
            agent_id: agent_id.clone(),
            player_address: caller,
            strategy_type,
            entry_fee: payment.clone(),
            final_roi: 0,
            registered_at: timestamp,
        };

        // Store agent
        self.agents(&agent_id).set(&agent);
        self.agent_list().push(&agent_id);

        // Add to prize pool
        let current_pool = self.prize_pool().get();
        self.prize_pool().set(&(current_pool + payment));
    }

    /// Start the tournament (owner only)
    #[endpoint(startTournament)]
    #[only_owner]
    fn start_tournament(&self) {
        require!(
            self.tournament_state().get() == STATE_REGISTRATION,
            "Tournament already started or ended"
        );
        require!(
            !self.agent_list().is_empty(),
            "No agents registered"
        );
        self.tournament_state().set(STATE_ACTIVE);
    }

    /// Update agent score (owner only, called by off-chain engine)
    #[endpoint(updateScore)]
    #[only_owner]
    fn update_score(&self, agent_id: ManagedBuffer, roi_basis_points: i64) {
        require!(
            self.tournament_state().get() == STATE_ACTIVE,
            "Tournament not active"
        );
        require!(
            !self.agents(&agent_id).is_empty(),
            "Agent not found"
        );

        let mut agent = self.agents(&agent_id).get();
        agent.final_roi = roi_basis_points;
        self.agents(&agent_id).set(&agent);
    }

    /// End tournament and distribute prizes (owner only)
    #[endpoint(endTournament)]
    #[only_owner]
    fn end_tournament(&self) {
        require!(
            self.tournament_state().get() == STATE_ACTIVE,
            "Tournament not active"
        );

        self.tournament_state().set(STATE_ENDED);

        // Get sorted leaderboard (top 3)
        let leaderboard = self.get_sorted_agents();
        let prize_pool = self.prize_pool().get();

        if leaderboard.is_empty() {
            return;
        }

        // Distribute prizes to top 3
        let len = leaderboard.len();

        if len >= 1 {
            let first = leaderboard.get(0);
            let prize = &prize_pool * PRIZE_FIRST / 10000u64;
            self.send().direct_egld(&first.player_address, &prize);
        }

        if len >= 2 {
            let second = leaderboard.get(1);
            let prize = &prize_pool * PRIZE_SECOND / 10000u64;
            self.send().direct_egld(&second.player_address, &prize);
        }

        if len >= 3 {
            let third = leaderboard.get(2);
            let prize = &prize_pool * PRIZE_THIRD / 10000u64;
            self.send().direct_egld(&third.player_address, &prize);
        }

        // Clear prize pool
        self.prize_pool().set(BigUint::zero());
    }

    /// Get a single agent by ID
    #[view(getAgent)]
    fn get_agent(&self, agent_id: ManagedBuffer) -> AgentEntry<Self::Api> {
        require!(!self.agents(&agent_id).is_empty(), "Agent not found");
        self.agents(&agent_id).get()
    }

    /// Get all agents (leaderboard)
    #[view(getLeaderboard)]
    fn get_leaderboard(&self) -> ManagedVec<AgentEntry<Self::Api>> {
        self.get_sorted_agents()
    }

    /// Get tournament state
    #[view(getTournamentState)]
    fn get_tournament_state_view(&self) -> u8 {
        self.tournament_state().get()
    }

    /// Get prize pool balance
    #[view(getPrizePool)]
    fn get_prize_pool(&self) -> BigUint {
        self.prize_pool().get()
    }

    /// Get entry fee
    #[view(getEntryFee)]
    fn get_entry_fee(&self) -> BigUint {
        self.entry_fee().get()
    }

    /// Get agent count
    #[view(getAgentCount)]
    fn get_agent_count(&self) -> usize {
        self.agent_list().len()
    }

    // === Internal Functions ===

    fn get_sorted_agents(&self) -> ManagedVec<AgentEntry<Self::Api>> {
        let mut agents: ManagedVec<AgentEntry<Self::Api>> = ManagedVec::new();

        for i in 1..=self.agent_list().len() {
            let agent_id = self.agent_list().get(i);
            let agent = self.agents(&agent_id).get();
            agents.push(agent);
        }

        // Simple bubble sort by ROI (descending)
        let len = agents.len();
        for i in 0..len {
            for j in 0..(len - i - 1) {
                let a = agents.get(j);
                let b = agents.get(j + 1);
                if a.final_roi < b.final_roi {
                    // Swap
                    agents.set(j, &b);
                    agents.set(j + 1, &a);
                }
            }
        }

        agents
    }

    // === Storage ===

    #[storage_mapper("agents")]
    fn agents(&self, agent_id: &ManagedBuffer) -> SingleValueMapper<AgentEntry<Self::Api>>;

    #[storage_mapper("agent_list")]
    fn agent_list(&self) -> VecMapper<ManagedBuffer>;

    #[storage_mapper("entry_fee")]
    fn entry_fee(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("tournament_state")]
    fn tournament_state(&self) -> SingleValueMapper<u8>;

    #[storage_mapper("prize_pool")]
    fn prize_pool(&self) -> SingleValueMapper<BigUint>;
}
