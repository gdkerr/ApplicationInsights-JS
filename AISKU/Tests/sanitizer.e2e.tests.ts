/// <reference path='./TestFramework/Common.ts' />
import { Initialization } from '../Initialization'
import { ApplicationInsights } from 'applicationinsights-analytics-js';
import { Sender } from 'applicationinsights-channel-js';

export class SanitizerE2ETests extends TestClass {
    private readonly _instrumentationKey = 'b7170927-2d1c-44f1-acec-59f4e1751c11';
    
    private appInsights: ApplicationInsights;

    // Sinon
    private errorSpy: SinonSpy;
    private successSpy: SinonSpy;
    private loggingSpy: SinonSpy;

    private delay = 100;

    public testInitialize() {
        try{
            this.useFakeServer = false;
            (<any>sinon.fakeServer).restore();
            this.useFakeTimers = false;
            this.clock.restore();

            var init = new Initialization({
                config: {
                    instrumentationKey: this._instrumentationKey,
                    extensionConfig: {
                        'AppInsightsChannelPlugin': {
                            maxBatchInterval: 500
                        }
                    }
                },
                queue: []
            });
            this.appInsights = init.loadAppInsights();

            // Setup Sinon stuff
            const sender: Sender = this.appInsights.core['_extensions'][2].channelQueue[0][0];
            this.errorSpy = this.sandbox.spy(sender, '_onError');
            this.successSpy = this.sandbox.spy(sender, '_onSuccess');
            this.loggingSpy = this.sandbox.stub(this.appInsights.core.logger, 'throwInternal');
        } catch (e) {
            console.error('Failed to initialize');
        }
    }

    public testCleanup() {
        this.useFakeServer = true;
        this.useFakeTimers = true;
    }

    public registerTests() {
        this.addAsyncTests();
    }

    private addAsyncTests(): void {
        var boilerPlateAsserts = () => {
            Assert.ok(this.successSpy.called, "success");
            Assert.ok(!this.errorSpy.called, "no error sending");
        }

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts sanitized names",
            stepDelay: this.delay,
            steps: [
                () => {

                    var properties = {
                        "property1%^~`": "hello",
                        "property2*&#+": "world"
                    };

                    var measurements = {
                        "measurement@|": 300
                    };

                    this.appInsights.trackMetric({name: "test", average: 5});
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response", 5, 1000))
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts legal charater set names",
            stepDelay: this.delay,
            steps: [
                () => {
                    var properties = {
                        "abcdefghijklmnopqrstuvwxyz": "hello",
                        "ABCDEFGHIJKLMNOPQRSTUVWXYZ": "world"
                    };

                    var measurements = {
                        "(1234567890/ \_-.)": 300
                    };

                    this.appInsights.trackMetric({name: "test", average: 5});
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response", 5, 1000))
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 150 charaters for names",
            stepDelay: this.delay,
            steps: [
                () => {
                    var len = 150;
                    var name = new Array(len + 1).join('a');

                    this.appInsights.trackMetric({name: name, average: 5});
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response", 5, 1000))
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 1024 charaters for values",
            stepDelay: this.delay,
            steps: [
                () => {
                    var len = 1024;
                    var value = new Array(len + 1).join('a');

                    var properties = {
                        "testProp": value
                    };

                    this.appInsights.trackMetric({name: "test", average: 5});
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response", 5, 1000))
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 2048 charaters for url",
            stepDelay: this.delay,
            steps: [
                () => {
                    var len = 2048;
                    var url = "http://hello.com/";
                    url = url + new Array(len - url.length + 1).join('a');

                    this.appInsights.trackPageView({name: "test", uri: url});
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response", 5, 1000))
                .concat(() => {
                    boilerPlateAsserts();
                })
        });

        this.testCaseAsync({
            name: "Sanitizer2ETests: Data platform accepts up to 32768 charaters for messages",
            stepDelay: this.delay,
            steps: [
                () => {
                    var len = 32768;
                    var message = new Array(len + 1).join('a');

                    this.appInsights.trackTrace({message: message, severityLevel: 0});
                },
            ].concat(<any>PollingAssert.createPollingAssert(() => {
                Assert.ok(true, "waiting for response " + new Date().toISOString());
                return (this.successSpy.called || this.errorSpy.called || this.loggingSpy.called);
            }, "Wait for response", 5, 1000))
                .concat(() => {
                    boilerPlateAsserts();
                })
        });
    }
}