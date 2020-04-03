// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IMetricTelemetry } from '@microsoft/applicationinsights-common';
import * as React from 'react';
import ReactPlugin from './ReactPlugin';

/**
 * Higher-order component function to hook Application Insights tracking 
 * in a React component's lifecycle.
 * 
 * @param reactPlugin ReactPlugin instance
 * @param Component the React component to be instrumented 
 * @param componentName (optional) component name
 * @param className (optional) className of the HOC div
 */
export default function withTelemetryTracking<P>(reactPlugin: ReactPlugin, Component: React.ComponentType<P>, componentName?: string, className?: string): React.ComponentClass<P> {

  if (componentName === undefined || componentName === null || typeof componentName !== 'string') {
    componentName = Component.prototype.constructor.name;
  }

  if (className === undefined || className === null || typeof className !== 'string') {
    className = '';
  }

  return class extends React.Component<P> {
    // Defines variables that they will need. We will adjust this to be variables that we need
    private _mountTimestamp: number = 0;
    private _firstActiveTimestamp: number = 0;
    private _idleStartTimestamp: number = 0;
    private _lastActiveTimestamp: number = 0;
    private _totalIdleTime: number = 0;
    private _idleCount: number = 0;
    private _idleTimeout: number = 5000;
    private _intervalId?: any;

    // OUR VARIABLES
    private _buttonClickCount: number = 0;
    private _errorCount: number = 0;
    private _paginationCount: number = 0;

    //Runs when the components mounts. Initializes data
    public componentDidMount() {
      this._mountTimestamp = Date.now();
      this._firstActiveTimestamp = 0;
      this._totalIdleTime = 0;
      this._lastActiveTimestamp = 0;
      this._idleStartTimestamp = 0;
      this._idleCount = 0;

      this._intervalId = setInterval(() => {
        if (this._lastActiveTimestamp > 0 && this._idleStartTimestamp === 0 && Date.now() - this._lastActiveTimestamp >= this._idleTimeout) {
          this._idleStartTimestamp = Date.now();
          this._idleCount++;
        }
      }, 100);
    }

    //Ran when the component is unmounting. aggregation of data occurs here
    public componentWillUnmount() {
      if (this._mountTimestamp === 0) {
        throw new Error('withTelemetryTracking:componentWillUnmount: mountTimestamp is not initialized.');
      }
      if (this._intervalId) {
        clearInterval(this._intervalId);
      }

      if (this._firstActiveTimestamp === 0) {
        return;
      }

      // There main data value that they are tracking
      const engagementTime = this.getEngagementTimeSeconds();
      // TODO we will need to configure this to have metric data that we need
      const metricData: IMetricTelemetry = {
        average: engagementTime,
        // We don't just want engagementTime, we want # of buttons clicked etc
        name: 'React Component Engaged Time (seconds)',
        sampleCount: 1
      };

      // When the component unmounts they are sending over the average idle time data
      const additionalProperties: { [key: string]: any } = { 'Component Name': componentName };
      reactPlugin.trackMetric(metricData, additionalProperties);
    }

    public render() {
      return (
        <div
          /**
           * Runs the trackActivity method any time any of these things are done. Here is where
           * I beleive we will put our telemetry data stuff. Potentially running different methods
           * to track different telemtry data such as running one method when a button is clicked,
           * another when pagination occurs etc.
           *  
           * */ 
          onKeyDown={this.trackActivity}
          onMouseMove={this.trackActivity}
          onScroll={this.trackActivity}
          onMouseDown={this.trackActivity}
          onTouchStart={this.trackActivity}
          onTouchMove={this.trackActivity}
          className={className}
        >
          <Component {...this.props} />
        </div>
      );
    }

    private trackActivity = (e: React.SyntheticEvent<any>): void => {
      // TODO This is where they are manipulating data based on what they are tracking. Seems like they are mostly just tracking idle time
      if (this._firstActiveTimestamp === 0) {
        this._firstActiveTimestamp = Date.now();
        this._lastActiveTimestamp = this._firstActiveTimestamp;
      } else {
        this._lastActiveTimestamp = Date.now();
      }

      if (this._idleStartTimestamp > 0) {
        const lastIdleTime = this._lastActiveTimestamp - this._idleStartTimestamp;
        this._totalIdleTime += lastIdleTime;
        this._idleStartTimestamp = 0;
      }
    }

    private getEngagementTimeSeconds(): number {
      return (Date.now() - this._firstActiveTimestamp - this._totalIdleTime - this._idleCount * this._idleTimeout) / 1000;
    }
  }
}
