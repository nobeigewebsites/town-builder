
/* ==========================================
   TOWN BUILDER V1.0
   RESEARCH, ACHIEVEMENTS & OBJECTIVES
   ========================================== */

(() => {

'use strict';

const RESEARCH = Object.freeze({

    harvesting:{
        name:'Agricultural automation',
        cost:120,
        days:2,
        benefit:'Optional automatic harvesting'
    },

    replanting:{
        name:'Seed planning',
        cost:100,
        days:2,
        requires:'harvesting',
        benefit:'Optional automatic replanting'
    },

    storage:{
        name:'Storage management',
        cost:150,
        days:3,
        benefit:'40 additional storage units'
    },

    logistics:{
        name:'Trade logistics',
        cost:180,
        days:3,
        benefit:'Up to 10% off imports'
    }

});

const ACHIEVEMENTS = Object.freeze({

    village:{
        name:'A place to call home',
        metric:'homes',
        target:5
    },

    community:{
        name:'A growing community',
        metric:'households',
        target:10
    },

    harvest:{
        name:'Green fingers',
        metric:'harvested',
        target:50
    },

    industry:{
        name:'Made locally',
        metric:'batches',
        target:10
    },

    exports:{
        name:'Open for trade',
        metric:'exportRevenue',
        target:500
    },

    knowledge:{
        name:'Curious minds',
        metric:'research',
        target:4
    }

});

const OBJECTIVES = Object.freeze({

    grow:{
        name:'Bring in the harvest',
        metric:'harvested',
        target:30,
        reward:180
    },

    make:{
        name:'Local manufacturer',
        metric:'batches',
        target:3,
        reward:150
    },

    trade:{
        name:'Trading connections',
        metric:'exportRevenue',
        target:150,
        reward:100
    },

    housing:{
        name:'Room to grow',
        metric:'homes',
        target:2,
        reward:200
    }

});

const own=(obj,id)=>Object.hasOwn(obj,id);

class TownProgression {

    constructor(economy,simulation=null) {

        if(simulation && simulation.economy!==economy)
            throw new Error('World mismatch');

        this.economy=economy;
        this.simulation=simulation;
        this.town=economy.town;
        this.farm=economy.farm;
        this.industry=economy.industry;

        this.researched=new Set();
        this.active=null;
        this.automation=new Map();
        this.achievements=new Set();

        this.objectives=new Map(
            Object.keys(OBJECTIVES).map(id=>[
                id,{status:'available',baseline:0}
            ])
        );

        this.harvested=0;
        this.exportRevenue=0;
        this.researchCosts=0;
        this.objectiveRevenue=0;

    }

    fail(reason){
        return {ok:false,reason};
    }

    // ==========================================
    // RESEARCH MANAGEMENT
    // ==========================================

    researchStatus(id){

        if(!own(RESEARCH,id)) return 'unknown';

        if(this.researched.has(id))
            return 'complete';

        if(this.active?.id===id)
            return this.active.paused
                ?'paused':'researching';

        const d=RESEARCH[id];

        if(d.requires && !this.researched.has(d.requires))
            return 'prerequisite';

        return 'available';

    }

    startResearch(id){

        if(this.active)
            return this.fail(
                'Finish or cancel the current project first'
            );

        if(this.researchStatus(id)!=='available')
            return this.fail('Research unavailable');

        const d=RESEARCH[id];

        if(this.town.cash<d.cost)
            return this.fail('Insufficient funds');

        this.town.cash-=d.cost;
        this.researchCosts+=d.cost;

        this.active={
            id,
            remaining:d.days,
            paused:false
        };

        this.farm.note('Research started: '+d.name);

        return {ok:true};

    }

    pauseResearch(paused=true){

        if(!this.active)
            return this.fail('No active research');

        this.active.paused=!!paused;

        return {ok:true};

    }

    cancelResearch(){

        if(!this.active)
            return this.fail('No active research');

        const d=RESEARCH[this.active.id];

        const refund=Math.floor(
            d.cost*this.active.remaining/d.days
        );

        this.town.cash+=refund;
        this.researchCosts-=refund;
        this.active=null;

        return {ok:true,refund};

    }

    tickResearch(){

        if(!this.active || this.active.paused)
            return;

        if(--this.active.remaining>0)
            return;

        const id=this.active.id;

        this.researched.add(id);

        if(id==='storage')
            this.farm.baseStorage+=40;

        this.active=null;

        this.farm.note(
            'Research completed: '+RESEARCH[id].name
        );

    }

    // ==========================================
    // OPTIONAL AGRICULTURAL AUTOMATION
    // ==========================================

    setAutomation(id,harvest,replant=false){

        this.farm.sync();

        if(!this.farm.fields.has(id))
            return this.fail('Select a field');

        if(harvest && !this.researched.has('harvesting'))
            return this.fail('Research harvesting first');

        if(replant && (
            !harvest ||
            !this.researched.has('replanting')
        ))
            return this.fail(
                'Research replanting and enable harvesting first'
            );

        if(harvest){

            this.automation.set(id,{
                harvest:true,
                replant:!!replant
            });

        }else{

            this.automation.delete(id);

        }

        return {ok:true};

    }

    harvest(id){

        const r=this.farm.harvest(id);

        if(r.ok){

            this.harvested+=r.quantity;

            this.checkAchievements();

        }

        return r;

    }

    tickAutomation(){

        this.farm.sync();

        for(const [id,a] of this.automation){

            const field=this.farm.fields.get(id);

            if(!field){

                this.automation.delete(id);

                continue;

            }

            if(
                !a.harvest ||
                this.farm.stage(id)!=='Ready to harvest'
            ) continue;

            const crop=field.crop;

            const r=this.harvest(id);

            if(r.ok && a.replant)
                this.farm.plant(id,crop);

        }

    }

    // ==========================================
    // IMPROVED TRADE LOGISTICS
    // ==========================================

    importPrice(product){

        if(!own(TownIndustryProducts,product))
            return 0;

        const normal=this.industry.importPrice(product);

        if(!this.researched.has('logistics'))
            return normal;

        return Math.max(
            TownIndustryProducts[product].price+1,
            Math.ceil(normal*.9)
        );

    }

    importGoods(product,quantity){

        if(
            !own(TownIndustryProducts,product) ||
            !Number.isSafeInteger(quantity) ||
            quantity<1 || quantity>10000
        )
            return this.fail('Invalid import');

        const cost=this.importPrice(product)*quantity;

        if(this.town.cash<cost)
            return this.fail('Insufficient funds');

        if(!this.industry.add(product,quantity))
            return this.fail('Not enough storage');

        this.town.cash-=cost;
        this.industry.expenses+=cost;

        this.farm.note(
            'Imported '+quantity+' '+
            TownIndustryProducts[product].name+
            ' for £'+cost
        );

        return {ok:true,cost};

    }

    exportGoods(product,quantity){

        const r=this.economy.exportGoods(product,quantity);

        if(r.ok){

            this.exportRevenue+=r.income;

            this.checkAchievements();

        }

        return r;

    }

    // ==========================================
    // PROGRESSION STATISTICS
    // ==========================================

    metrics(){

        if(this.simulation)
            this.simulation.sync();

        const homes=[...this.town.buildings.values()]
            .filter(b=>
                TownEconomyBuildings[b.type]?.kind==='housing'
            ).length;

        return {

            homes,

            households:this.economy.households(),

            harvested:this.harvested,

            batches:this.industry.completed,

            exportRevenue:this.exportRevenue,

            research:this.researched.size

        };

    }

    // ==========================================
    // PERMANENT ACHIEVEMENT RECORDS
    // ==========================================

    checkAchievements(){

        const m=this.metrics();

        for(const [id,d] of Object.entries(ACHIEVEMENTS)){

            if(
                !this.achievements.has(id) &&
                m[d.metric]>=d.target
            ){

                this.achievements.add(id);

                this.farm.note(
                    'Achievement: '+d.name
                );

            }

        }

    }

    // ==========================================
    // OPTIONAL OBJECTIVES
    // ==========================================

    acceptObjective(id){

        const o=this.objectives.get(id);

        if(!o || o.status!=='available')
            return this.fail('Objective unavailable');

        o.baseline=this.metrics()[OBJECTIVES[id].metric];

        o.status='active';

        return {ok:true};

    }

    objectiveProgress(id){

        const o=this.objectives.get(id);

        if(!o || o.status==='available')
            return 0;

        if(o.status==='completed')
            return OBJECTIVES[id].target;

        return Math.max(
            0,
            this.metrics()[OBJECTIVES[id].metric]-o.baseline
        );

    }

    claimObjective(id){

        const o=this.objectives.get(id);

        if(!o || o.status!=='active')
            return this.fail('Objective not active');

        const d=OBJECTIVES[id];

        if(this.objectiveProgress(id)<d.target)
            return this.fail('Objective incomplete');

        o.status='completed';

        this.town.cash+=d.reward;

        this.objectiveRevenue+=d.reward;

        this.farm.note(
            'Objective completed: '+d.name
        );

        return {ok:true,reward:d.reward};

    }

    cancelObjective(id){

        const o=this.objectives.get(id);

        if(!o || o.status!=='active')
            return this.fail('Objective not active');

        o.status='available';
        o.baseline=0;

        return {ok:true};

    }

    // ==========================================
    // SHARED SIMULATION CLOCK
    // ==========================================

    advance(days=1){

        if(
            !Number.isSafeInteger(days) ||
            days<1 || days>365
        )
            return this.fail('Invalid days');

        for(let i=0;i<days;i++){

            const result=(
                this.simulation||this.economy
            ).advance(1);

            if(!result.ok)
                return result;

            const cash=this.town.cash;

            this.tickResearch();

            this.tickAutomation();

            this.checkAchievements();

            const report=this.economy.last;

            if(report){

                report.progressionNet=this.town.cash-cash;

                report.closingCash=this.town.cash;

                report.cashChange=
                    report.closingCash-report.openingCash;

            }

        }

        return {
            ok:true,
            day:this.farm.day
        };

    }

}

window.TownProgression=TownProgression;
window.TownResearchProjects=RESEARCH;
window.TownAchievements=ACHIEVEMENTS;
window.TownObjectives=OBJECTIVES;

})();
