# 3loc

A simple-yet-customizable integration test tool:

0. Choose a test scenrio for your integration tests
0. Writes our test fixtures into one or several CSV files
0. Run the command and enjoy the results !

## Principles

3loc runs tests against existing system, sending input and expecting results.
If received results are not the one expected, it will complain.

You don't need to *write* tests by yourself: pick a scenario, and provide only fixtures (input and expected values)

The fixtures are gathered into a CSV file (which contains the test scenario id), and each line will be processed as a test.

If you can't find any scenario for your own case, go to the [Scenario authoring section](TODO).
