import * as React from "react";

interface ILifecycleProps {
  onCreate?: () => any;
  onDestroy?: () => any;
}

export class Lifecycle extends React.Component<ILifecycleProps> {
  constructor(props: any) {
    super(props);
  }

  public componentDidMount() {
    if (this.props.onCreate) {
      this.props.onCreate();
    }
  }

  public componentWillUnmount() {
    if (this.props.onDestroy) {
      this.props.onDestroy();
    }
  }

  public render() {
    return this.props.children || null;
  }
}
