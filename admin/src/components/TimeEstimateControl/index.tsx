import React from 'react';
import { InputNumber, Input, Select } from 'antd';
import * as time from 'util/time';
import './index.less';

const { Option } = Select;

interface Settings {
  initialValue?: number;
  placeholder: string;
  name: string;
}

interface Props {
  from: Settings;
  to: Settings;
  onChange: (out: Output) => void;
}

interface Output {
  from: number;
  to: number;
}

const timeOptionsMap = {
  h: { label: 'Hours', base: time.HOUR },
  d: { label: 'Days', base: time.DAY },
  w: { label: 'Weeks', base: time.WEEK },
  m: { label: 'Months', base: time.MONTH },
  y: { label: 'Years', base: time.YEAR },
};
const timeOptions = Object.entries(timeOptionsMap).map(([k, v]) => ({
  key: k as TimeOptionKey,
  ...v,
}));
type TimeOptionKey = keyof typeof timeOptionsMap;

interface Package {
  tok: TimeOptionKey;
  value: number;
  raw: number;
}

// convert seconds to base units
const rawToBase = (raw: number): Package => {
  // heuristic - find the shortest charlength numeric conversion of input
  const converted = timeOptions.map(to => raw / to.base);
  const lengths = converted.map(c => String(c).length);
  let minInd = 0;
  lengths.forEach((l, i) => (minInd = lengths[minInd] > l ? i : minInd));
  return {
    tok: timeOptions[minInd].key,
    // rounded - should always find a whole number if vals generated via this Control
    value: Math.round(converted[minInd]),
    raw,
  };
};

// base units to seconds
const baseToRaw = (value: number, tok: TimeOptionKey) => {
  return timeOptionsMap[tok].base * value;
};

const STATE = {
  fromPkg: rawToBase(0),
  toPkg: rawToBase(0),
};
type State = typeof STATE;

export default class TimeEstimateControl extends React.Component<Props, State> {
  state: State = {
    ...STATE,
    fromPkg: rawToBase(this.props.from.initialValue || 0),
    toPkg: rawToBase(this.props.to.initialValue || 0),
  };
  render() {
    const { fromPkg, toPkg } = this.state;

    const renderTimeOpts = (
      label: string,
      pkg: Package,
      settings: Settings,
      onChange: (v: number, tok: TimeOptionKey) => void,
    ) => (
      <Input.Group size="large" compact>
        <span className="ant-input-group-addon TimeEstimateControl-label">{label}</span>
        <InputNumber
          value={pkg.value}
          name={settings.name}
          placeholder={settings.placeholder}
          step={1}
          onChange={x => onChange(x || 0, pkg.tok)}
          size="large"
        />
        <Select value={pkg.tok} size="large" onSelect={tok => onChange(pkg.value, tok)}>
          {timeOptions.map(o => (
            <Option key={o.key} value={o.key}>
              {o.label}
            </Option>
          ))}
        </Select>
      </Input.Group>
    );

    return (
      <div className="TimeEstimateControl">
        {renderTimeOpts('FROM', fromPkg, this.props.from, this.handleFromChange)}
        {renderTimeOpts('TO', toPkg, this.props.to, this.handleToChange)}
      </div>
    );
  }

  private handleFromChange = (value: number, tok: TimeOptionKey) => {
    const raw = baseToRaw(value, tok);
    this.setState(
      {
        fromPkg: { value, tok, raw },
      },
      this.sendState,
    );
  };

  private handleToChange = (value: number, tok: TimeOptionKey) => {
    const raw = baseToRaw(value, tok);
    this.setState(
      {
        toPkg: { value, tok, raw },
      },
      this.sendState,
    );
  };

  private sendState = () => {
    this.props.onChange({
      from: this.state.fromPkg.raw,
      to: this.state.toPkg.raw,
    });
  };
}
