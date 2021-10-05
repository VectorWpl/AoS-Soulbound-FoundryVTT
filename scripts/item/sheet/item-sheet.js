import ItemTraits from "../../apps/item-traits.js";

export class AgeOfSigmarItemSheet extends ItemSheet {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
        classes: ["age-of-sigmar-soulbound", "sheet", "item"],
        width: 420,
        height: 530,
        resizable: true,
        tabs: [
            {
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description",
            },
        ]
    });
}

get template() {
   return `systems/age-of-sigmar-soulbound/template/sheet/${this.item.type}.html`
}


  activateListeners(html) {
    super.activateListeners(html);
    html.find("input").focusin(ev => this._onFocusIn(ev));
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    buttons = [
      {
        label: game.i18n.localize("BUTTON.POST_ITEM"),
        class: "item-post",
        icon: "fas fa-comment",
        onclick: (ev) => this.item.sendToChat(),
      }
    ].concat(buttons);
    return buttons;
  }

  getData() {
    const data = super.getData();
    data.data = data.data.data; // project system data so that handlebars has the same name and value paths
    return data;
  }

  _onFocusIn(event) {
    $(event.currentTarget).select();
  }

  activateListeners(html)
  {
    super.activateListeners(html)
    html.find(".item-traits").click(ev => {
      new ItemTraits(this.item).render(true)
    })

    html.find(".effect-create").click(ev => {
      if (this.item.isOwned)
        ui.notifications.error("Effects can only be added to world items or actors directly")

      this.object.createEmbeddedDocuments("ActiveEffect", [{ label: "New Effect", icon: "icons/svg/aura.svg" }])
    })

    html.find(".effect-edit").click(ev => {
      let id = $(ev.currentTarget).parents(".item").attr("data-item-id")
      this.object.effects.get(id).sheet.render(true)
    })

    html.find(".effect-delete").click(ev => {
      let id = $(ev.currentTarget).parents(".item").attr("data-item-id")
      this.object.deleteEmbeddedDocuments("ActiveEffect", [id])
    })
  }
}