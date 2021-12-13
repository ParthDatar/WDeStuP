This repository allows the user to create Petri Nets. It has a built in modeler, a simulator for said model,
and an interpreter to check the qualities of the Petri Net. Petri Nets can be generally defined as a model
involving places, arcs, and transitions, where tokens flow between places and transitions through arcs.

Petri nets are often used to model concurrency, such as the synchronization of a mathematical operation,
or a credit and debit balancing operation. The tokens, by their nature, model an operation occuring, and
traveling from one place to another. Since multiple operations may be necessary to progress in stages,
transitions may require multiple tokens from multiple places. This can also simulate the condition of a loop,
if the tokens may return to their original places organically.

To install the design studio, simply clone this git repository, and create a docker container for it. Then,
at localhost:8888, you too can create your own Petri Nets.

To model after installation, compose your model through the composition visualizer, building your places,
transitions, and the arcs in between, and then populating your places with tokens. You may even name your
objects, should you so wish.

Then go to the Petri Visualizer, and you can see a simulation of the Petri Net. Click on the question mark
to discover the properties of your Petri Net, and the rewind button to reset the model to its initial place.

You can find some helpful examples, such as two roads, nowhere, a double add net, and a shift net!
