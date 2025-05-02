import * as React from "react";
import type { ISafetywalksPdfProps } from "./ISafetywalksPdfProps";
import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";
import "./style.css";
import LoadAndBindPdf from "./LoadAndBindPdf/LoadAndBindPdf";

export default class SafetywalksPdf extends React.Component<
  ISafetywalksPdfProps,
  {}
> {
  constructor(prop: ISafetywalksPdfProps) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
    graph.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
  }
  public render(): React.ReactElement<ISafetywalksPdfProps> {
    return (
      <div style={{ width: "100%" }}>
        <LoadAndBindPdf />
      </div>
    );
  }
}
