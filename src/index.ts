import { HomeAssistant, LovelaceCardConfig, fireEvent } from "custom-card-helpers";
import { LitElement, TemplateResult, css, html, property } from "lit-element";
import { DropdownOption, FormControl, FormControlRow, FormControlType, ValueChangedEvent } from "./interfaces";

export default class EditorForm extends LitElement {
    @property({ attribute: false }) _hass: HomeAssistant;
    @property({ attribute: false }) _config: LovelaceCardConfig;

    setConfig(config: LovelaceCardConfig) {
        this._config = config;
    }

    set hass(hass: HomeAssistant) {
        this._hass = hass;
    }

    renderForm(formRows: FormControlRow[]) {
        return html`
        <div class="card-config">
            ${formRows.map(row => {
                const cssClass = row.cssClass ? `form-row ${row.cssClass}` : "form-row";
                return html`
                    <div class="${cssClass}">
                        <label>${row.label}</label>
                        ${row.controls.map(control => this.renderControl(control))}
                    </div>
                    `;
                })}            
        </div>
        `;
    }     

    renderControl(control: FormControl): TemplateResult {
        switch (control.type) {
            case FormControlType.Dropdown:
                return this.renderDropdown(control.label, control.configValue, control.items);
            case FormControlType.Radio:
                if(control.items === undefined) {
                    throw new Error("Radio control must have items defined");
                }
                return this.renderRadio(control.label, control.configValue, control.items);
            case FormControlType.Checkboxes:
                if(control.items === undefined) {
                    throw new Error("Radio control must have items defined");
                }
                return this.renderCheckboxes(control.label, control.configValue, control.items);
            case FormControlType.Switch:
                return this.renderSwitch(control.label, control.configValue);
            case FormControlType.Textbox:
                return this.renderTextbox(control.label, control.configValue);
        }

        return html``;
    }

    private _valueChanged(ev: ValueChangedEvent): void {
        if (!this._config || !this._hass) {
            return;
        }
        const target = ev.target;
        const detail = ev.detail;

        if (target.tagName === "HA-CHECKBOX") {
            // Add or remove the value from the array
            const index = this._config[target.configValue].indexOf(target.value);
            if (target.checked && index < 0) {
                this._config[target.configValue] = [...this._config[target.configValue], target.value];
            } else if (!target.checked && index > -1) {
                this._config[target.configValue] = [...this._config[target.configValue].slice(0, index), ...this._config[target.configValue].slice(index + 1)];
            }
        }

        else if (target.configValue) {
            this._config = {
                ...this._config,
                [target.configValue]: target.checked !== undefined || !detail?.value ? target.value || target.checked : target.checked || detail.value,
            }
        }
        fireEvent(this, "config-changed", {
            config: this._config
        });
    }

    getEntitiesByDomain(domain: string): DropdownOption[] {
        return Object.keys(this._hass.states)
            .filter((eid: string) => eid.substr(0, eid.indexOf(".")) === domain)
            .map((item) => this.formatList(item, this._hass));
    }

    getEntitiesByDeviceClass(domain: string, device_class: string): DropdownOption[] {
        return Object.keys(this._hass.states)
            .filter((eid: string) => eid.substr(0, eid.indexOf(".")) === domain && this._hass.states[eid].attributes.device_class === device_class)
            .map((item) => this.formatList(item, this._hass));
    }

    formatList = (entity: string, hass: HomeAssistant): DropdownOption => ({
        label: hass.states[entity].attributes.friendly_name,
        value: entity
    });

    getDropdownOptionsFromEnum(enumValues: any): DropdownOption[] {
        const options: DropdownOption[] = [];
        for (const [key, value] of Object.entries(enumValues)) {
            options.push({ value: value, label: key } as DropdownOption);
        }
        return options;
    }

    renderTextbox = (label: string | undefined, configValue: string) => {
        return html`
        <div class="form-control">
            <ha-textfield
                label="${label}"
                .value="${this._config[configValue] ?? ''}"
                .configValue="${configValue}"
                @change="${this._valueChanged}">
            </ha-textfield>
        </div>
        `;
    }

    renderSwitch = (label: string | undefined, configValue: string) => {
        return html`
        <div class="form-control">
            <ha-switch
                id="${configValue}"
                name="${configValue}"
                .checked="${this._config[configValue]}"
                .configValue="${configValue}"
                @change="${this._valueChanged}"
            >
            </ha-switch>
            <label for="${configValue}">${label}</label>
        </div>
        `;
    }

    renderDropdown = (label: string | undefined, configValue: string, items?: DropdownOption[]) => {
        return html`  
        <div class="form-control">
            <ha-combo-box
                label="${label}"
                .value="${this._config[configValue]}"
                .configValue="${configValue}"
                .items="${items}"
                @value-changed="${this._valueChanged}"
                @change=${this._valueChanged}
            ></ha-combo-box>
        </div>
          `;
    }

    renderRadio = (label: string | undefined, configValue: string, items: DropdownOption[]) => {
        return html`
            <div class="form-control">
                <label>${label}</label>
                ${items.map(item => {
                    return html`
                        <ha-radio
                            id="${configValue}_${item.value}"
                            name="${configValue}"
                            .checked="${this._config[configValue] === item.value}"
                            .configValue="${configValue}"
                            .value="${item.value}"
                            @change="${this._valueChanged}"
                        >
                        </ha-radio>
                        <label for="${configValue}_${item.value}">${item.label}</label>
                    `;
                })}
            </div>
          `;
    }

    renderCheckboxes = (label: string | undefined, configValue: string, items: DropdownOption[]) => {
        return html`
            <label>${label}</label>
            ${items.map(item => {
                return html`                
                <div class="form-control">
                    <ha-checkbox
                        id="${configValue}_${item.value}"
                        name="${configValue}[]"
                        .checked="${this._config[configValue].indexOf(item.value) > -1}"
                        .configValue="${configValue}"
                        .value="${item.value}"
                        @change="${this._valueChanged}"
                    >
                    </ha-checkbox>
                    <label for="${configValue}_${item.value}">${item.label}</label>
                </div>
                `;
            })}
          `;
    }

    static get styles() {
        return css`
            .form-row {
                margin-bottom: 10px;
            }
            .form-control {
                display: flex;
                align-items: center;
            }
            ha-switch {
                padding: 16px 6px;
            }
            .side-by-side {
                display: flex;
                flex-flow: row wrap;
            }            
            .side-by-side > label {
                width: 100%;
            }
            .side-by-side > .form-control {
                width: 49%;
                padding: 3px;
            }
            ha-textfield { 
                width: 100%;
            }
        `;
    }
}