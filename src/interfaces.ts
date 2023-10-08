export interface DropdownOption {
    label: string | undefined;
    value: string;
}

export interface ValueChangedEvent {
    detail: {
        value: {
            itemValue: string;
            parentElement: {
                configValue: string;
            };
        }
    };
    target: {
        value: string;
        configValue: string;
        checked?: boolean;
        tagName?: string;
    };
    
}

export interface FormControlRow {
    label?: string;
    controls: FormControl[];
    cssClass?: string;
}

export interface FormControl {
    label?: string;
    configValue: string;
    type: FormControlType;
    items?: DropdownOption[] | undefined;
    cssClass?: string;
}

export enum FormControlType {
    Dropdown = "dropdown",
    Checkbox = "checkbox",
    Checkboxes = "checkboxes",
    Radio = "radio",
    Switch = "switch",
    Textbox = "textbox"
}