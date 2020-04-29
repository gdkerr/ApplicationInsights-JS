import { IPageViewTelemetry, IMetricTelemetry } from "@microsoft/applicationinsights-common";
import * as React from "react";
import ReactPlugin from "../src/ReactPlugin";
import withTelemetryTracking from "../src/withTelemetryTracking";
import * as Enzyme from 'enzyme'
import * as Adapter from 'enzyme-adapter-react-16'
import TestComponentButton from "./TestComponentButton";

Enzyme.configure({
  adapter: new Adapter(),
});
let reactPlugin: ReactPlugin;
let TestComponentWithTracking;
let trackedTestComponentWrapper;
let trackMetricSpy;

describe("withTelemetryTracking(TestComponentButton)", () => {

  beforeEach(() => {
    reactPlugin = new ReactPlugin();
    TestComponentWithTracking = withTelemetryTracking(reactPlugin, TestComponentButton);
    trackedTestComponentWrapper = () => Enzyme.shallow(<TestComponentWithTracking />);
    trackMetricSpy = reactPlugin.trackMetric = jest.fn();
  });

  it("should wrap <TestComponentButton />", () => {
    const component = trackedTestComponentWrapper();
    expect(component.find(TestComponentButton).length).toBe(1);
  });

  it("shouldn't call trackMetric if there's no user interaction", () => {
    const component = trackedTestComponentWrapper();
    component.unmount();
    expect(trackMetricSpy).toHaveBeenCalledTimes(0);
  });

  it("should call trackMetric if there is user interaction", () => {
    const component = trackedTestComponentWrapper();
    component.simulate("click");
    component.unmount();

    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: expect.any(Number),
      name: "React Component Times Clicked",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "TestComponentButton" });
  });

  it("should track accurate number of button clicks", () => {
    const component = trackedTestComponentWrapper();
    component.simulate("click");
    component.simulate("click");
    component.simulate("click");
    component.simulate("click");
    component.simulate("click");
    component.unmount();

    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: 5,
      name: "React Component Times Clicked",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "TestComponentButton"});
  });

  it("should use the passed component name in trackMetric", () => {
    const TestComponentWithTrackingCustomName = withTelemetryTracking(reactPlugin, TestComponentButton, "MyCustomName");
    const component = Enzyme.shallow(<TestComponentWithTrackingCustomName />);
    component.simulate("click");
    component.unmount();

    expect(trackMetricSpy).toHaveBeenCalledTimes(1);
    const metricTelemetry: IMetricTelemetry & IPageViewTelemetry = {
      average: expect.any(Number),
      name: "React Component Times Clicked",
      sampleCount: 1
    };
    expect(trackMetricSpy).toHaveBeenCalledWith(metricTelemetry, { "Component Name": "MyCustomName" });
  });
});
