export class AgeOfSigmarItem extends Item {

    async _preUpdate(updateData, options, user) {
        await super._preUpdate(updateData, options, user)
        
        // TODO Remove when wound item type is deprecated
        if (this.type == "wound" && hasProperty(updateData, "data.woundType")) {
            switch (updateData.data.woundType) {
                case "minor":
                    updateData.name = "Minor Wound";
                    updateData.data.damage = 1
                    break;
                case "serious":
                    updateData.name = "Serious Wound";
                    updateData.data.damage = 2
                    break;
                case "deadly":
                    updateData.name = "Deadly Wound";
                    updateData.data.damage = 3
                    break;
                default: 
                    updateData.data.damage = 0;
            }
        }
    }

    prepareData() {
        super.prepareData()
    }

    prepareOwnedData() {
        let functionName = `prepareOwned${this.type[0].toUpperCase() + this.type.slice(1)}`

        if (this[functionName])
            this[functionName]()

        if (this.isAttack)
            this.prepareAttack()
    }

    prepareAttack() {
        if (this.category === "melee") {
            this.pool = this.actor.skills.weaponSkill.total;
            this.focus = this.actor.skills.weaponSkill.focus;
        } else {
            this.pool = this.actor.skills.ballisticSkill.total;
            this.focus = this.actor.skills.ballisticSkill.focus;
        }
        if(this.isSwarm) {
            this.pool += this.actor.combat.health.toughness.value;
        }
    }

    async addCondition(effect) {
        if (typeof (effect) === "string")
          effect = duplicate(CONFIG.statusEffects.find(e => e.id == effect))
        if (!effect)
          return "No Effect Found"
    
        if (!effect.id)
          return "Conditions require an id field"
    
    
        let existing = this.hasCondition(effect.id)
    
        if (!existing) {
          effect.label = game.i18n.localize(effect.label)
          effect["flags.core.statusId"] = effect.id;
          delete effect.id
          return this.createEmbeddedDocuments("ActiveEffect", [effect])
        }
      }
    
      async removeCondition(effect, value = 1) {
        if (typeof (effect) === "string")
          effect = duplicate(CONFIG.statusEffects.find(e => e.id == effect))
        if (!effect)
          return "No Effect Found"
    
        if (!effect.id)
          return "Conditions require an id field"
    
        let existing = this.hasCondition(effect.id)
    
        if (existing) {
          return existing.delete()
        }
      }
    
    
      hasCondition(conditionKey) {
        let existing = this.effects.find(i => i.getFlag("core", "statusId") == conditionKey)
        return existing
      }



    async sendToChat() {
        const item = new CONFIG.Item.documentClass(this.data._source);
        if (item.data.img.includes("/unknown")) {
            item.data.img = null;
        }

        const html = await renderTemplate("systems/age-of-sigmar-soulbound/template/chat/item.html", { item, data: item.data.data });
        const chatData = {
            user: game.user.id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
            chatData.whisper = [game.user];
        }
        ChatMessage.create(chatData);
    }


    // @@@@@@ FORMATTED GETTERs @@@@@@
    get State() {
        switch (this.type) {
            case "ally":
                return game.i18n.localize("STATE.ALIVE");
            case "enemy":
                return game.i18n.localize("STATE.ALIVE");
            case "resource":
                return game.i18n.localize("STATE.ACTIVE");
            case "rumour":
                return game.i18n.localize("STATE.ACTIVE");
            case "fear":
                return game.i18n.localize("STATE.ACTIVE");
            case "threat":
                return game.i18n.localize("STATE.ACTIVE");
            default:
                return game.i18n.localize("HEADER.STATE");
        }
    }

    get Traits () {
        return Object.values(this.traitList).map(i => i.display)
    }

    get traitList () {
        let traits = {}
        this.data.data.traits.forEach(i => {
            traits[i.name] = {
                name : i.name,
                display : game.aos.config.traits[i.name]
            }
            if (game.aos.config.traitsWithValue.includes(i.name))
            {
                traits[i.name].rating = i.value;
                traits[i.name].display += ` (${i.value})`
            }
        })
        return traits
    }

    get DN() {
        return {difficulty : parseInt(this.dn.split(":")[0]), complexity : parseInt(this.dn.split(":")[1])}
    }

    get Test() {
        let test = this.test
        return `DN ${test.dn} ${game.aos.config.attributes[test.attribute]} (${game.aos.config.skills[test.skill]})`
    }

    // @@@@@@ TYPE GETTERS @@@@@@
    /************** ITEMS *********************/
    get isTalent() { return this.type === "talent" }
    get isGoal() { return this.type === "goal" }
    get isConnection() { return this.type === "connection" }
    get isWound() { return this.type === "wound" }
    get isSpell() { return this.type === "spell" }
    get isMiracle() { return this.type === "miracle" }
    get isPower() { return this.isSpell || this.isMiracle }
    /************** PARTY ITEMS *********************/
    get isShortGoal() { return this.type === "goal" && this.subtype === "short" }
    get isLongGoal() { return this.type === "goal" && this.subtype === "long" }
    get isAlly() { return this.type === "ally" }
    get isEnemy() { return this.type === "enemy" }
    get isResource() { return this.type === "resource" }
    get isRumour() { return this.type === "rumour" }
    get isFear() { return this.type === "fear" }
    get isThreat() { return this.type === "threat" }
    get isActive() { return this.state === "active" }
    /************** GEAR *********************/
    get isEquipped() { return this.state === "equipped" }
    get isArmour() { return this.type === "armour" }
    get isWeapon() { return this.type === "weapon" }
    get isAethericDevice() { return this.type === "aethericDevice" }
    get isAttack() { return this.isWeapon || (this.isAethericDevice && this.damage) }
    get isRune() { return this.type === "rune" }
    get isEquipment() { return this.type === "equipment" }

    get hasTest() {
        if (!this.test || !this.test.dn || !this.test.dn.includes(":"))
            return false;
        if (!game.aos.config.attributes[this.test.attribute])
            return false;
        return true;
    }

    // @@@@@@ DATA GETTERS @@@@@@
    get bonus() { return this.data.data.bonus }
    get description() { return this.data.data.description }
    get cost() { return this.data.data.cost }
    get availability() { return this.data.data.availability }
    get power() { return this.data.data.power }
    get requirements() { return this.data.data.requirements }
    get crafting() { return this.data.data.crafting }
    get damage() { return this.data.data.damage }
    get traits() { return this.data.data.traits }
    get state() { return this.data.data.state }
    get subtype() { return this.data.data.type }
    get benefit() { return this.data.data.benefit }
    get completed() { return this.data.data.completed }
    get target() { return this.data.data.target }
    get range() { return this.data.data.range }
    get duration() { return this.data.data.duration }
    get effect() { return this.data.data.effect }
    get god() { return this.data.data.god }
    get dn() { return this.data.data.dn }
    get test() { return this.data.data.test }
    get overcast() { return this.data.data.overcast }
    get lore() { return this.data.data.lore }
    get requirement() { return this.data.data.requirement }
    get category() { return this.data.data.category }
}