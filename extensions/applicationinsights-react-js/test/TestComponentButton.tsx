// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as React from "react";

export interface ITestComponentProps {
  prop1?: number;
  prop2?: string;
}

function shoot() {
  alert("ButtonHasBeenClicked");
}

export class TestComponentButton extends React.Component<ITestComponentProps> {
  public render() {
    const { prop1, prop2 } = this.props;
    return (
      <button onClick={shoot}>This is a button</button>
    );
  }
}

export default TestComponentButton;
